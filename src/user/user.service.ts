import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { UserEntity } from './models/user.entity';
import { User } from './models/user.interface';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>
    ) {}



    //foction de creation d'un utilisateur
    create(user: User): Observable<User> {
        return from(this.userRepository.save(user));
    }

    //fonction qui retourne tous un utilisateur
    findOne(id:number): Observable<User>{
        return from(this.userRepository.findOne(id));
    }

    //fonction qui retourne tous les utilisateurs
    findAll(): Observable<User[]>{
        return from(this.userRepository.find());
    }

    //fonction qui supprimme un utilisateurs
    deleteOne(id:number): Observable<any>{
        return from(this.userRepository.delete(id));
    }

    //fonctie qui modifie un utilisateur.
    updateOne(id:number , user:User): Observable<any>{
        return from(this.userRepository.update(id , user));
    }
}
