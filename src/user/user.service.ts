import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, throwError } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { Like, Repository } from 'typeorm';
import { UserEntity } from './models/user.entity';
import { User } from './models/user.interface';
import { switchMap, map, catchError} from 'rxjs/operators';
import {paginate, Pagination, IPaginationOptions} from 'nestjs-typeorm-paginate';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>
        ,private  authService:AuthService
    ) {}



    //foction de creation d'un utilisateur
    create(user: User): Observable<User> {
        //pipe():permet de combiner plusieurs fonctions 
        return this.authService.hashPassword(user.password).pipe(
            //switchMap():c'est un operateur qui nous permet de declancher des emissions de valeur, chaque fois qu'un autre observable emmet une valeur 
            switchMap((passwordHash: string) => {
                const newUser = new UserEntity();
                newUser.name = user.name;
                newUser.username = user.username;
                newUser.email = user.email;
                newUser.password = passwordHash;
                newUser.role = user.role;

                return from(this.userRepository.save(newUser)).pipe(
                    map((user: User) => {
                        const {password, ...result} = user;
                        return result;
                    }),
                    catchError(err => throwError(err))
                )
            })
        )
        //return from(this.userRepository.save(user));
    }





    //fonction qui retourne tous un utilisateur
    findOne(id:number): Observable<User>{
        return from(this.userRepository.findOne({id})).pipe(
            map((user: User) => {
                const {password, ...result} = user;
                //console.log(result);
                return result;
            } )
        )
        //return from(this.userRepository.findOne(id));
    }




    //fonction qui retourne tous les utilisateurs
    findAll(): Observable<User[]>{
        return from(this.userRepository.find()).pipe(
            //on supprime la proprete mot de passe de l'utilisateur.
            map((users: User[]) => {
                users.forEach(function (v) {delete v.password});
                return users;
            })
        );
        //return from(this.userRepository.find());
    }

    


    //fonction qui returne une pagination d'utilisateurs.
    paginate(options: IPaginationOptions): Observable<Pagination<User>> {
        return from(paginate<User>(this.userRepository, options)).pipe(
            map((usersPageable: Pagination<User>) => {
                usersPageable.items.forEach(function (v) {delete v.password});

                return usersPageable;
            })
        )
    }




    //fonction qui supprimme un utilisateurs
    deleteOne(id:number): Observable<any>{
        return from(this.userRepository.delete(id));
    }




    //fonctie qui modifie un utilisateur.
    updateOne(id:number , user:User): Observable<any>{
        //on enleve le proprietes email et password de l'utilisateur.
        delete user.email;
        delete user.password;
        return from(this.userRepository.update(id , user)).pipe(
            switchMap(() => this.findOne(id))
        );
    }


    //Login
    login(user: User): Observable<string> {
        return this.validateUser(user.email, user.password).pipe(
            switchMap((user: User) => {
                if(user) {
                    return this.authService.generateJWT(user).pipe(map((jwt: string) => jwt));
                } else {
                    return 'Wrong Credentials';
                }
            })
        )
    }

    
    //Valider un utilisateurs
    validateUser(email: string, password: string): Observable<User> {
        return this.findByMail(email).pipe(
            switchMap((user: User) => this.authService.comparePasswords(password, user.password).pipe(
                map((match: boolean) => {
                    if(match) {
                        const {password, ...result} = user;
                        console.log(result);
                        return result;
                    } else {
                        throw Error;
                    }
                })
            ))
        )

    }



    //Rechercher l'utilisateur par Email.
    findByMail(email: string): Observable<User> {
        return from(this.userRepository.findOne({email}));
    }



    //modifier le ro;e d'un utilisateurs
    updateRoleOfUser(id: number, user: User): Observable<any> {
        return from(this.userRepository.update(id, user));
    }


    //pagination par nom d'utilisateur.
    paginateFilterByUsername(options: IPaginationOptions, user: User): Observable<Pagination<User>>{
        console.log(options);
        const val = + options.page -1
        return from(this.userRepository.findAndCount({
            skip: + options.page *  + options.limit || 0,
            take: +options.limit || 10,
            order: {id: "ASC"},
            select: ['id', 'name', 'username', 'email', 'role'],
            where: [
                { username: Like(`%${user.username}%`)}
            ]
        })).pipe(
            map(([users, totalUsers]) => {
                const usersPageable: Pagination<User> = {
                    items: users,
                    links: {
                        first: options.route + `?limit=${options.limit}`,
                        previous: options.route + ``,
                        next: options.route + `?limit=${options.limit}&page=${+ options.page +1}`,
                        last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / + options.limit)}`
                    },
                    meta: {
                        currentPage: + options.page,
                        itemCount: users.length,
                        itemsPerPage: + options.limit,
                        totalItems: totalUsers,
                        totalPages: Math.ceil(totalUsers / + options.limit)
                    }
                };              
                return usersPageable;
            })
        )
    }
}
